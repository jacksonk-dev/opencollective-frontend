import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import Button from './Button';
import InputField from './InputField';
import EditTiers from './edit-collective/EditTiers';
import TimezonePicker from './TimezonePicker';
import Container from './Container';
import { P } from './Text';
import Modal, { ModalBody, ModalHeader, ModalFooter } from './StyledModal';

class EditEventForm extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
    deleting: PropTypes.bool,
    onDelete: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTiersChange = this.handleTiersChange.bind(this);
    this.handleTimezoneChange = this.handleTimezoneChange.bind(this);
    this.handleModal = this.handleModal.bind(this);

    const event = { ...(props.event || {}) };
    event.slug = event.slug ? event.slug.replace(/.*\//, '') : '';
    this.state = { event, tiers: event.tiers || [{}], disabled: false, showDeleteModal: false };

    this.messages = defineMessages({
      'slug.label': { id: 'event.slug.label', defaultMessage: 'url' },
      'type.label': { id: 'event.type.label', defaultMessage: 'type' },
      'name.label': { id: 'event.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'event.amount.label', defaultMessage: 'amount' },
      'description.label': {
        id: 'event.description.label',
        defaultMessage: 'Short description',
      },
      'longDescription.label': {
        id: 'event.longDescription.label',
        defaultMessage: 'Long description',
      },
      'startsAt.label': {
        id: 'event.startsAt.label',
        defaultMessage: 'start date and time',
      },
      'endsAt.label': {
        id: 'event.endsAt.label',
        defaultMessage: 'end date and time',
      },
      'location.label': {
        id: 'event.location.label',
        defaultMessage: 'location',
      },
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.event && (!prevProps.event || this.props.event.name !== prevProps.event.name)) {
      this.setState({ event: this.props.event, tiers: this.props.event.tiers });
    }
  }

  handleChange(fieldname, value) {
    const event = {};
    event[fieldname] = value;

    // Make sure that endsAt is always >= startsAt
    if (fieldname === 'startsAt') {
      const endsAt = this.state.event.endsAt;
      if (!endsAt || new Date(endsAt) < new Date(value)) {
        let newEndDate = new Date(value);
        if (!endsAt) {
          newEndDate.setHours(newEndDate.getHours() + 2);
        } else {
          // https://github.com/opencollective/opencollective/issues/1232
          const endsAtDate = new Date(endsAt);
          newEndDate = new Date(value);
          newEndDate.setHours(endsAtDate.getHours());
          newEndDate.setMinutes(endsAtDate.getMinutes());
        }
        value = newEndDate.toString();
        event['endsAt'] = value;
      }
    }
    if (fieldname === 'name') {
      if (!event['name'].trim()) {
        this.setState({ disabled: true });
      } else {
        this.setState({ disabled: false });
      }
    }

    this.setState({ event: Object.assign({}, this.state.event, event) });
  }

  handleTimezoneChange(timezone) {
    this.handleChange('timezone', timezone.value);
  }

  handleTiersChange(tiers) {
    this.setState(tiers);
  }

  handleModal() {
    this.setState(state => ({
      showDeleteModal: !state.showDeleteModal,
    }));
  }

  async handleSubmit() {
    const event = Object.assign({}, this.state.event);
    event.tiers = this.state.tiers;
    this.props.onSubmit(event);
  }

  render() {
    const { event, loading, intl, deleting, onDelete } = this.props;

    if (!event.parentCollective) return <div />;

    const isNew = !(event && event.id);
    const submitBtnLabel = loading ? 'loading' : isNew ? 'Create Event' : 'Save';
    const deleteBtnLabel = deleting ? 'deleting...' : 'Delete Event';
    const defaultStartsAt = new Date();
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    this.fields = [
      {
        name: 'name',
        maxLength: 255,
        placeholder: '',
      },
      {
        name: 'description',
        type: 'text',
        maxLength: 255,
        placeholder: '',
      },
      {
        name: 'startsAt',
        type: 'datetime',
        placeholder: '',
        defaultValue: defaultStartsAt,
        validate: date => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return date.isAfter(yesterday);
        },
      },
      {
        name: 'endsAt',
        type: 'datetime',
        options: { timezone: event.timezone },
        placeholder: '',
        validate: date => {
          const yesterday = new Date(this.state.event.startsAt || defaultStartsAt);
          yesterday.setDate(yesterday.getDate() - 1);
          return date.isAfter(yesterday);
        },
      },
      {
        name: 'timezone',
        type: 'TimezonePicker',
      },
      {
        name: 'location',
        placeholder: '',
        type: 'location',
      },
    ];

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    });

    return (
      <div className="EditEventForm">
        <style jsx>
          {`
            :global(.field) {
              margin: 1rem;
            }
            :global(label) {
              width: 150px;
              display: inline-block;
              vertical-align: top;
            }
            :global(input),
            select,
            :global(textarea) {
              width: 300px;
              font-size: 1.5rem;
            }

            .FormInputs {
              max-width: 700px;
              margin: 0 auto;
            }

            :global(textarea[name='longDescription']) {
              height: 50rem;
            }

            .actions {
              margin: 5rem auto 1rem;
              text-align: center;
            }

            :global(section#location) {
              margin-top: 0;
            }
          `}
        </style>

        <div className="FormInputs">
          <div className="inputs">
            {this.fields.map(field =>
              field.name === 'timezone' ? (
                <TimezonePicker
                  label="Timezone"
                  selectedTimezone={this.state.event.timezone}
                  onChange={this.handleTimezoneChange}
                />
              ) : (
                <InputField
                  key={field.name}
                  defaultValue={this.state.event[field.name] || field.defaultValue}
                  validate={field.validate}
                  ref={field.name}
                  name={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  type={field.type}
                  pre={field.pre}
                  context={{
                    timezone: this.state.event.timezone,
                  }}
                  onChange={value => this.handleChange(field.name, value)}
                />
              ),
            )}
          </div>
          <EditTiers
            title="Tickets"
            types={['TIER', 'TICKET', 'DONATION']}
            tiers={this.state.tiers}
            collective={{ ...event, type: 'EVENT' }}
            currency={event.parentCollective.currency}
            onChange={this.handleTiersChange}
          />
        </div>
        <div className="actions">
          {!isNew && event.isDeletable && (
            <Fragment>
              <Button className="red delete" label={deleteBtnLabel} onClick={this.handleModal} />
              <Modal width="570px" show={this.state.showDeleteModal} onClose={this.handleModal}>
                <ModalHeader>
                  <FormattedMessage
                    id="collective.delete.modal.header"
                    values={{ name: event.name }}
                    defaultMessage={'Delete {name}'}
                  />
                </ModalHeader>
                <ModalBody>
                  <P>
                    <FormattedMessage
                      id="collective.delete.modal.body"
                      values={{ type: 'event' }}
                      defaultMessage={'Are you sure you want to delete this {type}?'}
                    />
                  </P>
                </ModalBody>
                <ModalFooter>
                  <Container display="flex" justifyContent="flex-end">
                    <div>
                      <Button
                        className="blue"
                        label={<FormattedMessage id="collective.delete.cancel.btn" defaultMessage={'Cancel'} />}
                        disabled={deleting}
                        onClick={this.handleModal}
                      />
                      {'  '}
                      <Button
                        className="red confirmDelete"
                        disabled={deleting}
                        label={deleteBtnLabel}
                        onClick={() => {
                          onDelete();
                        }}
                      />
                    </div>
                  </Container>
                </ModalFooter>
              </Modal>
            </Fragment>
          )}
          <Button
            className="blue save"
            label={submitBtnLabel}
            onClick={this.handleSubmit}
            disabled={this.state.disabled ? true : loading}
          />
        </div>
      </div>
    );
  }
}

export default injectIntl(EditEventForm);
